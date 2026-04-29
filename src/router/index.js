import { createRouter, createWebHistory } from 'vue-router'
import JungleView from '../views/JungleView.vue'
import JungleControllerView from '../views/JungleControllerView.vue'

const routes = [
  { path: '/', component: JungleView },
  { path: '/jungle', component: JungleView },
  { path: '/jungle-controller', component: JungleControllerView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
