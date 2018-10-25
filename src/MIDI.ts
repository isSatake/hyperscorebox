import {Font, Note} from "./Types";
import {WebAudioFontPlayer} from "./WebAudioFontPlayer";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ctx = new AudioContext();
const player = new WebAudioFontPlayer();
const midiNotes: Note[] = [];
let tone: Font;

(async () => {
    const res = await fetch("https://stkay.github.io/webaudiofontdata/sound/0000_Aspirin_sf2_file.json");
    tone = await res.json();
})();

const midiNoteOn = async (pitch, velocity) => {
    console.log("midiNoteOn:", "pitch:", pitch, "velo:", velocity);
    midiNoteOff(pitch);
    const envelope = await player.queueWaveTable(ctx, ctx.destination, tone, 0, pitch, 123456789, velocity / 100);
    const note: Note = {
        pitch: pitch,
        envelope: envelope
    };
    midiNotes.push(note);
    const sho = Math.floor(pitch / 12);
    const noteName = NOTES[pitch % 12];
    let abcNote: string;
    if (sho > 5) {
        let _abcNote = noteName.toLowerCase();
        for (let i = 0; i < (sho - 6); i++) {
            _abcNote += "'";
        }
        abcNote = _abcNote;
    }else {
        let _abcNote = noteName;
        for (let i = 0; i < Math.abs(5 - sho); i++) {
            _abcNote += ",";
        }
        abcNote = _abcNote;
    }
    document.execCommand("insertText", null, abcNote);
    console.log(midiNotes)
};


const midiNoteOff = (pitch) => {
    for (let i = 0; i < midiNotes.length; i++) {
        if (midiNotes[i].pitch == pitch) {
            if (midiNotes[i].envelope) {
                midiNotes[i].envelope.cancel();
            }
            midiNotes.splice(i, 1);
            return;
        }
    }
};

const onMIDImessage = (event) => {
    const {data} = event;
    const cmd = data[0] >> 4;
    const channel = data[0] & 0xf;
    const type = data[0] & 0xf0;
    const pitch = data[1];
    const velocity = data[2];
    switch (type) {
        case 144:
            midiNoteOn(pitch, velocity);
            break;
        case 128:
            midiNoteOff(pitch);
            break;
    }
};

const onMIDIStateChange = (event) => {
    const {manufacturer, name, state} = event.port;
    console.log('midiOnStateChange', event);
    console.log(`${manufacturer} ${name} ${state}`);
};

//MIDIリクエスト
export const requestMIDIAccessFailure = e => console.log('failed to requestMIDIAccess', e);

export const requestMIDIAccessSuccess = midi => {
    console.log("succeeded to requestMIDIAccess");
    const inputs = midi.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        console.log('midi input', input);
        input.value.onmidimessage = onMIDImessage;
    }
    midi.onstatechange = onMIDIStateChange;
};