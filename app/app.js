import Vue from 'nativescript-vue'

import Home from './components/Home'


//register
Vue.registerElement('DrawingPad', () => require('@nativescript-community/drawingpad').DrawingPad)

new Vue({
  render: (h) => h('frame', [h(Home)]),
}).$start()
