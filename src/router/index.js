import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import ControllerView from '../views/ControllerView.vue'
import JungleView from '../views/JungleView.vue'
import JungleControllerView from '../views/JungleControllerView.vue'

const routes = [
  { path: '/',                   component: GameView },
  { path: '/controller',         component: ControllerView },
  { path: '/jungle',             component: JungleView },
  { path: '/jungle-controller',  component: JungleControllerView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
