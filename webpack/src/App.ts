import { demux, createAVIFormatContext } from '@libmedia/avformat'
import {
  createAVPacket,
  destroyAVPacket,
  AVMediaType,
  compileResource,
  destroyAVFrame
} from '@libmedia/avutil'
import { WasmVideoDecoder } from '@libmedia/avcodec'
import { Sleep } from '@libmedia/common/timer'

import { getIOReader, getAVFormat, getWasm, getAccept } from './utils'
import { hello } from './hello'

let file: File
let stop = true
let textarea: HTMLTextAreaElement = null

async function decode(log: (v: string) => void) {

  if (!stop) {
    return
  }

  const iformatContext = createAVIFormatContext()

  const ioReader = await getIOReader(file)

  const iformat = await getAVFormat(ioReader, file)

  iformatContext.ioReader = ioReader
  iformatContext.iformat = iformat

  const avpacket = createAVPacket()

  await demux.open(iformatContext)
  await demux.analyzeStreams(iformatContext) 

  const stream = iformatContext.getStreamByMediaType(AVMediaType.AVMEDIA_TYPE_VIDEO)

  const decoder = new WasmVideoDecoder({
    resource: await compileResource(getWasm('decoder', stream.codecpar.codecId), true),
    onReceiveAVFrame: (frame) => {
      log(`got video frame, pts: ${frame.pts}, duration: ${frame.duration}\n`)
      destroyAVFrame(frame)
    },
  })
  const ret = await decoder.open(addressof(stream.codecpar))
  if (ret) {
    log(`open decode error: ${ret}\n`)
    return
  }

  stop = false

  while (1) {

    let ret = await demux.readAVPacket(iformatContext, avpacket)
    if (ret !== 0) {
      break
    }
    if (avpacket.streamIndex === stream.index) {
      ret = decoder.decode(avpacket)
      if (ret != 0) {
        break
      }
    }

    if (stop) {
      break
    }

    // 这里是为了防止卡死主线程加的 sleep
    // 你可以将逻辑放入 worker 或定时任务中去掉此处
    await new Sleep(0)
  }
  await decoder.flush()
  decoder.close()
  iformatContext.destroy()
  destroyAVPacket(avpacket)
  stop = true
  log('decode end\n')
}

// @ts-ignore
window.onClick = function () {
  setValue('Loading...')
  decode((val) => {
    setValue(getValue() + val)
    textarea.scrollTop = textarea.scrollHeight
  })
}
// @ts-ignore
window.onChange = function (target: HTMLInputElement) {
  file = target.files[0]
}
// @ts-ignore
window.onStop = function () {
  stop = true
}

function setValue(value: string) {
  textarea.value = value
}

function getValue() {
  return textarea.value
}

document.body.innerHTML = `
<div>
    <button
      onClick="onClick()">
      开始
    </button>
    &nbsp;
    <button
      onClick="onStop()">
      停止
    </button>
    &nbsp;
    <input accept="${getAccept()}" type="file" onChange="onChange(this)"></input>
    <hr />
    <textarea readOnly id="textarea"  style="width: 600px; height: 400px"></textarea>
  </div>
`

textarea = document.querySelector('#textarea')

hello('libmedia')
