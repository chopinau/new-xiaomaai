declare module "gifshot" {
  export type GifObject = {
    error?: boolean
    errorCode?: string
    errorMsg?: string
    image?: string
  }

  export type GifOptions = {
    images: string[]
    gifWidth?: number
    gifHeight?: number
    interval?: number
    numFrames?: number
    numWorkers?: number
    sampleInterval?: number
    onProgress?: (progress: number) => void
  }

  const gifshot: {
    createGIF(options: GifOptions, callback: (result: GifObject) => void): void
  }

  export default gifshot
}
