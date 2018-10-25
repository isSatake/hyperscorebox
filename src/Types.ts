export type ABCLink = {
    startChars: number[],
    pageTitle: string
}

export type Line = {
    id: string,
    text: string
}

//コードブロックの状態
export type ABCBlock = {
    titleElementID: string
    titleElement: HTMLElement
    blockHeight: number
    abc: string
    isEditing: boolean
}

//楽譜表示部の状態
export type ScoreElement = {
    parentElementID: string
    element: HTMLElement
}

//MIDI
export type Zone = {
    midi?: number,
    keyRangeLow?: number,
    keyRangeHigh?: number,
    loopStart: number,
    loopEnd: number,
    coarseTune: number,
    fineTune: number,
    originalPitch: number,
    sampleRate: number,
    ahdsr?: boolean,
    sustain?: number,
    offset?: number,
    release?: number,
    fixedPitch?: number,
    file?: string,
    sample?: any,
    buffer?: any
}

export type Font = {
    zones: Zone[]
}

export type Envelope = {
    target,
    cancel: () => void,
    when,
    duration,
    pitch,
    font,
    audioBufferSourceNode
} & GainNode

export type Note = {
    pitch: number,
    envelope: Envelope
}