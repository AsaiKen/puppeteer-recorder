import EventEmitter from 'events'

const BORDER_THICKNESS = 3

const defaults = {
  showSelector: false
}

class UIController extends EventEmitter {
  constructor (options) {
    options = Object.assign({}, defaults, options)

    super()
    this._overlay = null
    this._selector = null
    this._element = null
    this._dimensions = {}
    this._showSelector = options.showSelector

    this._boundeMouseMove = this._mousemove.bind(this)
    this._boundeMouseUp = this._mouseup.bind(this)
  }

  showSelector () {
    console.debug('UIController:show')
    if (!this._overlay) {
      this._overlay = document.createElement('div')
      this._overlay.className = 'headlessRecorderOverlay'
      this._overlay.style.position = 'fixed'
      this._overlay.style.top = '0px'
      this._overlay.style.left = '0px'
      this._overlay.style.width = '100%'
      this._overlay.style.height = '100%'
      this._overlay.style.pointerEvents = 'none'

      if (this._showSelector) {
        this._selector = document.createElement('div')
        this._selector.className = 'headlessRecorderOutline'
        this._selector.style.position = 'fixed' // viewport内の座標を使えるようにする
        this._selector.style.border = BORDER_THICKNESS + 'px solid rgba(69,200,241,0.8)'
        this._selector.style.borderRadius = '3px'
        this._overlay.appendChild(this._selector)
      }
    }
    if (!this._overlay.parentNode) {
      document.body.appendChild(this._overlay)
      // 1.要素を選ぶ
      document.body.addEventListener('mousemove', this._boundeMouseMove, false)
      // 2.要素を決定（mouseup時にclickが発生)
      document.body.addEventListener('click', this._boundeMouseUp, false)
    }
  }

  hideSelector () {
    console.debug('UIController:hide')
    if (this._overlay) {
      document.body.removeChild(this._overlay)
    }
    this._overlay = this._selector = this._element = null
    this._dimensions = {}
  }

  _mousemove (e) {
    if (this._element !== e.target) {
      this._element = e.target

      // this._elementの範囲（viewport内の相対座標）を取得しておく
      if (this._selector) {
        let elem = e.target
        // document.bodyからの相対座標を計算
        while (elem && elem !== document.body) {
          this._dimensions.top += elem.offsetTop
          this._dimensions.left += elem.offsetLeft
          elem = elem.offsetParent
        }
        // viewport内の相対座標に変換
        this._dimensions.top = -window.scrollY
        this._dimensions.left = -window.scrollX
        // 要素の高さ・幅
        this._dimensions.width = this._element.offsetWidth
        this._dimensions.height = this._element.offsetHeight

        // this._selectorをその範囲に広げる
        this._selector.style.top = (this._dimensions.top - BORDER_THICKNESS) + 'px'
        this._selector.style.left = (this._dimensions.left - BORDER_THICKNESS) + 'px'
        this._selector.style.width = this._dimensions.width + 'px'
        this._selector.style.height = this._dimensions.height + 'px'
        console.debug(`top: ${this._selector.style.top}, left: ${this._selector.style.left}, width: ${this._selector.style.width}, height: ${this._selector.style.height}`)
      }
    }
  }

  _mouseup (e) {
    // 範囲を取ったという演出を入れる
    this._overlay.style.backgroundColor = 'white'
    setTimeout(() => {
      this._overlay.style.backgroundColor = 'none'
      this._cleanup()

      let clip = null

      if (this._selector) {
        clip = {
          x: this._selector.style.left,
          y: this._selector.style.top,
          width: this._selector.style.width,
          height: this._selector.style.height
        }
      }

      this.emit('click', { clip, raw: e })
    }, 100)
  }

  _cleanup () {
    document.body.removeEventListener('mousemove', this._boundeMouseMove, false)
    document.body.removeEventListener('click', this._boundeMouseUp, false)
    document.body.removeChild(this._overlay)
  }
}

module.exports = UIController
