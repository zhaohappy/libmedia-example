<script setup lang="ts">

import { ref } from 'vue'

import * as demux from '@libmedia/avformat/demux'
import { createAVIFormatContext } from '@libmedia/avformat/AVFormatContext'
import { createAVPacket, destroyAVPacket } from '@libmedia/avutil/util/avpacket'
import { AVMediaType } from '@libmedia/avutil/codec'
import compileResource from '@libmedia/avutil/function/compileResource'
import WasmVideoDecoder from '@libmedia/avcodec/wasmcodec/VideoDecoder'
import Sleep from '@libmedia/common/timer/Sleep'
import { destroyAVFrame } from '@libmedia/avutil/util/avframe'

import { getIOReader, getAVFormat, getWasm, getAccept } from './libmedia/utils'

let stop_ = true

let text = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)
let file: File

async function decode(log: (v: string) => void,  file: File) {

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

function onDecode() {
  text.value = 'Loading...'
  decode((val) => { 
    text.value += val
    textarea.value!.scrollTop = textarea.value!.scrollHeight
  }, file)
}

function onStop() {
  stop_ = true
} 

function onChange(event: any) {
  file = event.target.files[0]
}

</script>

<template>
  <div>
    <button @click="onDecode">
      开始
    </button>
    &nbsp;
    <button @click="onStop">
      停止
    </button>
    &nbsp;
    <input :accept="getAccept()" type="file" @change="onChange" />
    <hr />
    <textarea ref="textarea" readOnly :value="text" :style="{width: '600px', height: '400px'}"></textarea>
  </div>
</template>

<style scoped>

</style>
