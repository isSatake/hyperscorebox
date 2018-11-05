import * as abcjs from "abcjs/midi";

export class IMECandidate {
    private readonly index: number;
    private readonly msg: string;
    private readonly abcTextEl: HTMLTextAreaElement;
    private readonly abcContainerId: string;
    private readonly abcContainerEl: HTMLDivElement;
    private readonly div: HTMLDivElement;

    constructor(index: number) {
        this.index = index;
        this.msg = `IMECandidate#${this.index}`;
        this.abcContainerId = `note-candidate-${index}`;
        this.abcContainerEl = document.createElement("div");
        this.abcContainerEl.setAttribute("id", this.abcContainerId);
        this.abcTextEl = document.createElement("textarea");
        this.abcTextEl.style.position = "absolute";
        this.abcTextEl.style.left = "-1000px";
        this.div = document.createElement("div");
        this.div.appendChild(this.abcTextEl);
        this.div.appendChild(this.abcContainerEl);
        this.div.addEventListener("click", this.onClick);
    }

    public getDiv = () => this.div;
    public render = (abc: string) => {
        console.log(this.msg, "render");
        abcjs.renderAbc(this.abcContainerId, abc, {responsive: "resize"});
        this.abcTextEl.value = abc;
    };
    private onClick = () => {
        console.log(this.msg, "onclick");
        this.copyToClipboard()
    };
    private copyToClipboard = () => {
        console.log(this.msg, "copyToClipboard", `"${this.abcTextEl.value}"`);
        this.abcTextEl.select();
        document.execCommand("copy");
    };
    public reset = () => {
        console.log(this.msg, "reset");
        this.abcTextEl.value = "";
        this.abcContainerEl.textContent = "";
        this.abcContainerEl.classList.remove("abcjs-container");
        this.abcContainerEl.setAttribute("style", "");
    };
}