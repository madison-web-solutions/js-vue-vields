export type MediaItem = {
    id: string | number,
    status: 'uploading' | 'available' | 'missing',
    title: string,
    extension: string,
    src: string | null,
    alt: string | null,
    // media type ?
};

export type ResizableMediaItem = MediaItem & {
    src_icon: string,
};

export const isMediaItemResizable = (item: MediaItem): item is ResizableMediaItem => {
    return 'src_icon' in item;
};

export const getIconCssClass = function(item: MediaItem): string | null {
    if (item.status == 'missing') {
        return 'fas fa-exclamation-triangle';
    } else if (item.extension == 'svg') {
        return null;
    } else if (isMediaItemResizable(item)) {
        return null;
    } else {
        switch (item.extension) {
            case 'pdf':
                return 'fas fa-file-pdf';
            case 'doc':
            case 'docx':
                return 'fas fa-file-word';
            case 'xls':
            case 'xlsx':
                return 'fas fa-file-excel';
            case 'csv':
                return 'fas fa-file-csv';
            case 'ppt':
            case 'pptx':
                return 'fas fa-file-powerpoint';
            default:
                return 'fas fa-file';
        }
    }
};
