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

let stop_ = true

export async function decode(log: (v: string) => void,  file: File) {

  if (!stop_) {
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

  stop_ = false

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

    if (stop_) {
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
  stop_ = true
  log('decode end\n')
}
export function stop() {
  stop_ = true
}

