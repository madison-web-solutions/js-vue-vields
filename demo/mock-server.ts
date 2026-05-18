import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import sharp from 'sharp'
import type { MediaItem } from '../src/types'

type DB = {
  record: Record<string, unknown>
  media: Record<string, MediaItem>
}

const SEED_RECORD = {
  title: 'Hello World',
  slug: 'hello-world',
  status: 'draft',
  published_at: null,
  categories: [1, 3],
  featured_image_id: 'seed-cat-1',
  intro: 'This is the introduction to the article.',
  body: '<p>This is the <strong>body</strong> of the article.</p><p>Edit it using the rich text editor above.</p>',
  related_link: null,
  content_blocks: [],
  sidebar_items: [],
}

const STATIC_CHOICES: Record<string, { key: string | number; label: string }[]> = {
  statuses: [
    { key: 'draft', label: 'Draft' },
    { key: 'published', label: 'Published' },
    { key: 'archived', label: 'Archived' },
  ],
  categories: [
    { key: 1, label: 'Technology' },
    { key: 2, label: 'Design' },
    { key: 3, label: 'Business' },
    { key: 4, label: 'Science' },
    { key: 5, label: 'Culture' },
    { key: 6, label: 'Health' },
    { key: 7, label: 'Finance' },
    { key: 8, label: 'Travel' },
  ],
}

const STATIC_LINKS: Record<string, { key: string | number; label: string; url: string }[]> = {
  page: [
    { key: 1, label: 'Home', url: '/' },
    { key: 2, label: 'About Us', url: '/about' },
    { key: 3, label: 'Contact', url: '/contact' },
    { key: 4, label: 'Services', url: '/services' },
    { key: 5, label: 'Blog', url: '/blog' },
    { key: 6, label: 'Privacy Policy', url: '/privacy' },
  ],
  post: [
    { key: 1, label: 'Getting Started with Vue', url: '/blog/getting-started-with-vue' },
    { key: 2, label: 'Design Systems in Practice', url: '/blog/design-systems' },
    { key: 3, label: 'Building Accessible Forms', url: '/blog/accessible-forms' },
    { key: 4, label: 'TypeScript Tips and Tricks', url: '/blog/typescript-tips' },
    { key: 5, label: 'Component Library Architecture', url: '/blog/component-library' },
  ],
}

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// Extensions that sharp can resize
const RASTER_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

const readBody = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
};

const json = (res: ServerResponse, data: unknown, status = 200): void => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
};

const loadDb = (dbFile: string): DB => {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
  } catch {
    return { record: { ...SEED_RECORD }, media: {} };
  }
};

const saveDb = (dbFile: string, db: DB): void => {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
};

const validateRecord = (record: Record<string, unknown>): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  if (!record.title || String(record.title).trim() === '') {
    errors['title'] = ['Title is required'];
  } else if (String(record.title).length > 200) {
    errors['title'] = ['Title must be 200 characters or fewer'];
  }
  if (record.slug && !/^[a-z0-9-]+$/.test(String(record.slug))) {
    errors['slug'] = ['Slug may only contain lowercase letters, numbers and hyphens'];
  }
  return errors;
};

// Generate a 300px-wide thumbnail (preserving aspect ratio) for raster images.
// Returns the /uploads/-relative URL on success, or undefined if not applicable.
const generateThumbnail = async (srcPath: string, thumbPath: string): Promise<string | undefined> => {
  try {
    await sharp(srcPath)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .toFile(thumbPath);
    return `/uploads/${path.basename(thumbPath)}`;
  } catch (err) {
    console.warn(`[mock-server] Could not generate thumbnail for ${path.basename(srcPath)}:`, err);
    return undefined;
  }
};

const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

export const mockServerPlugin = (): Plugin => {
  return {
    name: 'vfm-mock-server',
    apply: 'serve',
    async configureServer(server) {
      const dataDir = path.resolve(process.cwd(), 'demo', 'data');
      const uploadsDir = path.join(dataDir, 'uploads');
      const dbFile = path.join(dataDir, 'db.json');

      fs.mkdirSync(uploadsDir, { recursive: true });

      if (!fs.existsSync(dbFile)) {
        const initialDataDir = path.resolve(process.cwd(), 'demo', 'initial-data');
        const seedUploadsDir = path.join(initialDataDir, 'uploads');
        const altTextFile = path.join(initialDataDir, 'alt-text.json');

        const altText: Record<string, string> = fs.existsSync(altTextFile)
          ? JSON.parse(fs.readFileSync(altTextFile, 'utf-8'))
          : {};

        const sourceFiles = fs.existsSync(seedUploadsDir)
          ? fs.readdirSync(seedUploadsDir).filter(f => !f.startsWith('.')).sort()
          : [];

        for (const filename of sourceFiles) {
          fs.copyFileSync(path.join(seedUploadsDir, filename), path.join(uploadsDir, filename));
        }

        // Generate one thumbnail per raster source file (shared across all repeated copies)
        const thumbUrls: Record<string, string> = {};
        for (const filename of sourceFiles) {
          const ext = path.extname(filename).slice(1).toLowerCase();
          if (RASTER_EXTS.has(ext)) {
            const base = path.basename(filename, path.extname(filename));
            const thumbFilename = `${base}-thumb.${ext}`;
            const thumbUrl = await generateThumbnail(
              path.join(uploadsDir, filename),
              path.join(uploadsDir, thumbFilename),
            );
            if (thumbUrl) thumbUrls[filename] = thumbUrl;
          }
        }

        const SEED_REPEAT = 5;
        const seedMedia: Record<string, MediaItem> = {};

        for (let pass = 0; pass < SEED_REPEAT; pass++) {
          for (const filename of sourceFiles) {
            const ext = path.extname(filename).slice(1).toLowerCase();
            const base = path.basename(filename, path.extname(filename));
            const titleBase = base.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const title = pass === 0 ? titleBase : `${titleBase} (${pass + 1})`;
            const id = `seed-${base}-${pass + 1}`;

            seedMedia[id] = {
              id,
              status: 'available',
              title,
              extension: ext,
              src: `/uploads/${filename}`,
              src_thumb: thumbUrls[filename],
              alt: altText[filename] ?? null,
            };
          }
        }

        saveDb(dbFile, { record: { ...SEED_RECORD }, media: seedMedia });
        console.log(`[mock-server] Seeded ${Object.keys(seedMedia).length} media items from ${sourceFiles.length} source files`);
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const rawUrl = req.url || '/';
        const method = req.method?.toUpperCase() || 'GET';

        // Serve uploaded static files
        if (rawUrl.startsWith('/uploads/')) {
          const filename = path.basename(rawUrl.split('?')[0].slice('/uploads/'.length));
          const filepath = path.join(uploadsDir, filename);
          if (fs.existsSync(filepath)) {
            const ext = path.extname(filename).toLowerCase();
            const mime = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            fs.createReadStream(filepath).pipe(res as NodeJS.WritableStream);
            return;
          }
          res.writeHead(404);
          res.end();
          return;
        }

        if (!rawUrl.startsWith('/api/')) {
          return next();
        }

        try {
          const u = new URL(rawUrl, 'http://localhost');
          const urlPath = u.pathname;
          const query = u.searchParams;

          // GET /api/record
          if (urlPath === '/api/record' && method === 'GET') {
            const db = loadDb(dbFile);
            return json(res, db.record);
          }

          // PUT /api/record
          if (urlPath === '/api/record' && method === 'PUT') {
            const body = await readBody(req);
            const record = JSON.parse(body);
            const errors = validateRecord(record);
            if (Object.keys(errors).length > 0) {
              return json(res, { ok: false, errors });
            }
            const db = loadDb(dbFile);
            db.record = record;
            saveDb(dbFile, db);
            return json(res, { ok: true });
          }

          // GET /api/media
          if (urlPath === '/api/media' && method === 'GET') {
            const db = loadDb(dbFile);
            const searchText = query.get('search') || '';
            const page = parseInt(query.get('page') || '1', 10);
            const pageSize = 20;

            let items = Object.values(db.media);
            if (searchText) {
              const q = searchText.toLowerCase();
              items = items.filter(
                (m) => m.title.toLowerCase().includes(q) || m.extension.toLowerCase().includes(q),
              );
            }

            // Most recently added first
            items = items.reverse();
            const start = (page - 1) * pageSize;
            return json(res, {
              page,
              hasMore: items.length > start + pageSize,
              suggestions: items.slice(start, start + pageSize),
            });
          }

          // POST /api/media
          if (urlPath === '/api/media' && method === 'POST') {
            const body = await readBody(req);
            const { filename, base64, title } = JSON.parse(body);

            const ext = path.extname(filename).toLowerCase();
            const extNoDot = ext.slice(1).toLowerCase();
            const id = crypto.randomUUID();
            const storedFilename = `${id}${ext}`;
            const filepath = path.join(uploadsDir, storedFilename);

            fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));

            let src_thumb: string | undefined;
            if (RASTER_EXTS.has(extNoDot)) {
              src_thumb = await generateThumbnail(
                filepath,
                path.join(uploadsDir, `${id}-thumb${ext}`),
              );
            }

            const item: MediaItem = {
              id,
              status: 'available',
              title: title || filename.split('.').slice(0, -1).join('.'),
              extension: extNoDot,
              src: `/uploads/${storedFilename}`,
              src_thumb,
              alt: null,
            };

            const db = loadDb(dbFile);
            db.media[id] = item;
            saveDb(dbFile, db);
            return json(res, { status: 'ok', resource: item });
          }

          // Routes for /api/media/:id
          const mediaItemMatch = urlPath.match(/^\/api\/media\/([^/]+)$/);
          if (mediaItemMatch) {
            const id = mediaItemMatch[1];
            const db = loadDb(dbFile);

            if (method === 'GET') {
              const item = db.media[id];
              if (item) return json(res, { status: 'found', resource: item });
              return json(res, { status: 'not-found' });
            }

            if (method === 'PUT') {
              if (!db.media[id]) {
                return json(res, { status: 'fail', errors: { _: ['Not found'] } });
              }
              const body = await readBody(req);
              const data = JSON.parse(body);

              if (data.base64) {
                // File replace — write new file, regenerate thumbnail
                const ext = path.extname(data.filename).toLowerCase();
                const extNoDot = ext.slice(1).toLowerCase();
                const storedFilename = `${id}${ext}`;
                const filepath = path.join(uploadsDir, storedFilename);
                fs.writeFileSync(filepath, Buffer.from(data.base64, 'base64'));

                let src_thumb: string | undefined;
                if (RASTER_EXTS.has(extNoDot)) {
                  src_thumb = await generateThumbnail(
                    filepath,
                    path.join(uploadsDir, `${id}-thumb${ext}`),
                  );
                }

                db.media[id] = {
                  ...db.media[id],
                  extension: extNoDot,
                  src: `/uploads/${storedFilename}`,
                  src_thumb,
                };
              } else {
                // Metadata update
                if (data.title !== undefined) db.media[id].title = data.title;
                if (data.alt !== undefined) db.media[id].alt = data.alt;
                if (data.cropCenter !== undefined) db.media[id].cropCenter = data.cropCenter;
              }

              saveDb(dbFile, db);
              return json(res, { status: 'ok', resource: db.media[id] });
            }

            if (method === 'DELETE') {
              const item = db.media[id];
              // Only delete physical files for user-uploaded items (not seeded shared files)
              if (item && !String(item.id).startsWith('seed-')) {
                if (item.src) deleteFile(path.join(uploadsDir, path.basename(item.src)));
                if (item.src_thumb) deleteFile(path.join(uploadsDir, path.basename(item.src_thumb)));
              }
              delete db.media[id];
              saveDb(dbFile, db);
              return json(res, true);
            }
          }

          // GET /api/choices/:directory
          const choicesMatch = urlPath.match(/^\/api\/choices\/([^/]+)$/);
          if (choicesMatch && method === 'GET') {
            const directory = choicesMatch[1];
            const searchText = query.get('search');
            const key = query.get('key');
            const page = parseInt(query.get('page') || '1', 10);
            const pageSize = 20;
            const choices = STATIC_CHOICES[directory] || [];

            if (key !== null) {
              const found = choices.find((c) => String(c.key) === key);
              if (found) return json(res, { status: 'found', resource: found });
              return json(res, { status: 'not-found' });
            }

            if (searchText !== null) {
              const q = searchText.toLowerCase();
              const filtered = q
                ? choices.filter((c) => c.label.toLowerCase().includes(q))
                : choices;
              const start = (page - 1) * pageSize;
              return json(res, {
                page,
                hasMore: filtered.length > start + pageSize,
                suggestions: filtered.slice(start, start + pageSize),
              });
            }

            return json(res, { status: 'found', resource: choices });
          }

          // GET /api/links/search
          if (urlPath === '/api/links/search' && method === 'GET') {
            const scheme = query.get('scheme') || '';
            const q = (query.get('q') || '').toLowerCase();
            const page = parseInt(query.get('page') || '1', 10);
            const pageSize = 10;

            const links = STATIC_LINKS[scheme] || [];
            const filtered = q ? links.filter((l) => l.label.toLowerCase().includes(q)) : links;
            const start = (page - 1) * pageSize;

            return json(res, {
              page,
              hasMore: filtered.length > start + pageSize,
              suggestions: filtered
                .slice(start, start + pageSize)
                .map((l) => ({ scheme, key: l.key, label: l.label, url: l.url })),
            });
          }

          // GET /api/links/lookup
          if (urlPath === '/api/links/lookup' && method === 'GET') {
            const scheme = query.get('scheme') || '';
            const key = query.get('key') || '';

            if (scheme === 'url') {
              return json(res, {
                status: 'found',
                resource: { scheme: 'url', key, label: key, url: key },
              });
            }

            const links = STATIC_LINKS[scheme] || [];
            const found = links.find((l) => String(l.key) === key);
            if (found) {
              return json(res, {
                status: 'found',
                resource: { scheme, key: found.key, label: found.label, url: found.url },
              });
            }
            return json(res, { status: 'not-found' });
          }

          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        } catch (err) {
          console.error('[mock-server]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    },
  };
};
