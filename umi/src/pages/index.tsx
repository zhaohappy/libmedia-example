
import { getAccept } from './libmedia/utils'
import { useEffect, useRef, useState } from 'react'
import { stop, decode} from './libmedia/decode'

export default function HomePage() {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [value])

  useEffect(() => {
    stop()
  }, [])

  let file: File

  function onChange(event: any) {
    file = event.target.files[0]
  }

  return (
    <div>
      <button
        onClick={() => {
          setValue('Loading...')
          decode((val) => {
            setValue((prev) => {
              return prev + val
            })
          }, file)
        }}
      >
        开始
      </button>
      &nbsp;
      <button
        onClick={() => {
          stop()
        }}
      >
        停止
      </button>
      &nbsp;
      <input accept={getAccept()} type="file" onChange={onChange}></input>
      <hr />
      <textarea readOnly ref={textareaRef} value={value} style={{width: '600px', height: '400px'}}></textarea>
    </div>
  )
}
