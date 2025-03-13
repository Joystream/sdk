import { ModalClosedError } from '../errors'
import { UxHandler } from './UxHandler'

interface OpenModalOptions {
  uri: string
}

interface ModalState {
  open: boolean
}

interface ModalInterface {
  subscribeModal: (callback: (state: ModalState) => void) => () => void
  closeModal: () => void
  openModal: (options: OpenModalOptions) => Promise<void>
}

export class ModalUxHandler implements UxHandler {
  constructor(private modal: ModalInterface) {}

  public requestConnect(uri: string, reject: (err?: Error) => void) {
    this.modal.openModal({ uri })
    const unsubscribeModal = this.modal.subscribeModal((state: ModalState) => {
      if (state.open === false) {
        unsubscribeModal()
        reject(new ModalClosedError())
      }
    })
  }

  public onFinalized() {
    this.modal.closeModal()
  }
}
