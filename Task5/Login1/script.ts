const districtRadioBtn = document.querySelector(".district_school .radio_button") as HTMLImageElement | null;
const independentRadioBtn = document.querySelector(".independent_school .radio_button") as HTMLImageElement | null;

districtRadioBtn?.parentElement?.addEventListener("click", () => {
    if (districtRadioBtn && independentRadioBtn) {
        districtRadioBtn.src = "../quantum-screen-assets/icons/radio-button-on.svg";
        independentRadioBtn.src = "../quantum-screen-assets/icons/radio-button-off.svg";
    }
});

independentRadioBtn?.parentElement?.addEventListener("click", () => {
    if (districtRadioBtn && independentRadioBtn) {
        districtRadioBtn.src = "../quantum-screen-assets/icons/radio-button-off.svg";
        independentRadioBtn.src = "../quantum-screen-assets/icons/radio-button-on.svg";
    }
});

const passwordInputElement = document.getElementById("password") as HTMLInputElement | null;
const previewImageElement = document.querySelector(".preview_image") as HTMLImageElement | null;

previewImageElement?.addEventListener("click", () => {
    if (passwordInputElement && previewImageElement) {
        if (passwordInputElement.type === "password") {
            passwordInputElement.type = "text";
        } else {
            passwordInputElement.type = "password";
            previewImageElement.src = "../quantum-screen-assets/icons/preview.svg";
        }
    }
});

const rememberContainerElement = document.querySelector(".remember") as HTMLElement | null;
const checkboxImageElement = rememberContainerElement?.querySelector("img") as HTMLImageElement | null;

let isCheckedValue = true;

checkboxImageElement?.addEventListener("click", () => {
    isCheckedValue = !isCheckedValue;
    if (checkboxImageElement) {
        checkboxImageElement.src = isCheckedValue
            ? "../quantum-screen-assets/icons/checkbox-checked.svg"
            : "../quantum-screen-assets/icons/checkbox-unchecked.svg";
    }
});

