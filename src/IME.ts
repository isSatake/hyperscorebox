export const createInput = () => {
    const container = document.getElementById("app-container");
    const formEl = document.createElement("input");
    const {style} = formEl;
    style.position = "fixed";
    style.bottom = "22px";
    style.left = "2px";
    style.zIndex = "300";
    container.appendChild(formEl);
};

// const dict