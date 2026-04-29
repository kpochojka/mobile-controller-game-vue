import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import ControllerView from '../views/ControllerView.vue'

const routes = [
  { path: '/',           component: GameView },
  { path: '/controller', component: ControllerView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
