import * as demux from '@libmedia/avformat/demux'
import { createAVIFormatContext } from '@libmedia/avformat/AVFormatContext'
import { createAVPacket, destroyAVPacket } from '@libmedia/avutil/util/avpacket'
import { AVMediaType } from '@libmedia/avutil/codec'
import compileResource from '@libmedia/avutil/function/compileResource'
import WasmVideoDecoder from '@libmedia/avcodec/wasmcodec/VideoDecoder'
import Sleep from '@libmedia/common/timer/Sleep'
import { destroyAVFrame } from '@libmedia/avutil/util/avframe'

import { getIOReader, getAVFormat, getWasm } from './utils'

async function decode(log: (v: string) => void) {

  const iformatContext = createAVIFormatContext()

  const ioReader = await getIOReader('https://zhaohappy.github.io/libmedia/docs/video/test.mp4')

  const iformat = await getAVFormat(ioReader, 'https://zhaohappy.github.io/libmedia/docs/video/test.mp4')

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

  const ret = await decoder.open(addressof(stream.codecpar), 4)
  if (ret) {
    log(`open decode error: ${ret}\n`)
    return
  }

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
    // 这里是为了防止卡死主线程加的 sleep
    // 你可以将逻辑放入 worker 或定时任务中去掉此处
    await new Sleep(0)
  }
  await decoder.flush()
  decoder.close()
  iformatContext.destroy()
  destroyAVPacket(avpacket)
  log('decode end\n')
}

async function run() {
  await decode(console.log)
}

run()