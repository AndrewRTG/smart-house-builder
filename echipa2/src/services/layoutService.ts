import api from './api';
import type { Layout, LayoutCreateDTO, LayoutUpdateDTO } from '../types/index';

export const layoutService = {
  /**
   * Obține toate layout-urile
   */
  getAllLayouts: () => {
    return api.get<Layout[]>('/layouts');
  },

  /**
   * Obține un layout după ID
   */
  getLayoutById: (id: number) => {
    return api.get<Layout>(`/layouts/${id}`);
  },

  /**
   * Salvează un layout nou
   */
  saveLayout: (layout: LayoutCreateDTO) => {
    return api.post<Layout>('/layouts', layout);
  },

  /**
   * Actualizează un layout existent
   */
  updateLayout: (id: number, layout: LayoutUpdateDTO) => {
    return api.put<Layout>(`/layouts/${id}`, layout);
  },

  /**
   * Șterge un layout după ID
   */
  deleteLayout: (id: number) => {
    return api.delete<void>(`/layouts/${id}`);
  }
};
