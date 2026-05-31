import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// Route components are lazy-loaded so each demo page is its own chunk — keeps things snappy
// as more content is added.
export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/article' },
  { path: '/article', name: 'article', component: () => import('./views/ArticleView.vue'), meta: { title: 'Article Form' } },
  { path: '/fields', name: 'fields', component: () => import('./views/AllFieldsView.vue'), meta: { title: 'All Fields' } },
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { title: 'Login Form' } },
  { path: '/public-form', name: 'public-form', component: () => import('./views/PublicFormView.vue'), meta: { title: 'Public Form' } },
  { path: '/repeaters', name: 'repeaters', component: () => import('./views/RepeatersView.vue'), meta: { title: 'Repeaters' } },
  { path: '/conditional', name: 'conditional', component: () => import('./views/ConditionalView.vue'), meta: { title: 'Conditional Logic' } },
  { path: '/addresses', name: 'addresses', component: () => import('./views/AddressesView.vue'), meta: { title: 'Reusable Components' } },
  { path: '/current-context', name: 'current-context', component: () => import('./views/CurrentContextView.vue'), meta: { title: 'Current Context' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
