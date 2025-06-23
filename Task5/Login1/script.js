var _a, _b;
var districtRadioBtn = document.querySelector(".district_school .radio_button");
var independentRadioBtn = document.querySelector(".independent_school .radio_button");
(_a = districtRadioBtn === null || districtRadioBtn === void 0 ? void 0 : districtRadioBtn.parentElement) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
    if (districtRadioBtn && independentRadioBtn) {
        districtRadioBtn.src = "../quantum-screen-assets/icons/radio-button-on.svg";
        independentRadioBtn.src = "../quantum-screen-assets/icons/radio-button-off.svg";
    }
});
(_b = independentRadioBtn === null || independentRadioBtn === void 0 ? void 0 : independentRadioBtn.parentElement) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () {
    if (districtRadioBtn && independentRadioBtn) {
        districtRadioBtn.src = "../quantum-screen-assets/icons/radio-button-off.svg";
        independentRadioBtn.src = "../quantum-screen-assets/icons/radio-button-on.svg";
    }
});
var passwordInputElement = document.getElementById("password");
var previewImageElement = document.querySelector(".preview_image");
previewImageElement === null || previewImageElement === void 0 ? void 0 : previewImageElement.addEventListener("click", function () {
    if (passwordInputElement && previewImageElement) {
        if (passwordInputElement.type === "password") {
            passwordInputElement.type = "text";
        }
        else {
            passwordInputElement.type = "password";
            previewImageElement.src = "../quantum-screen-assets/icons/preview.svg";
        }
    }
});
var rememberContainerElement = document.querySelector(".remember");
var checkboxImageElement = rememberContainerElement === null || rememberContainerElement === void 0 ? void 0 : rememberContainerElement.querySelector("img");
var isCheckedValue = true;
checkboxImageElement === null || checkboxImageElement === void 0 ? void 0 : checkboxImageElement.addEventListener("click", function () {
    isCheckedValue = !isCheckedValue;
    if (checkboxImageElement) {
        checkboxImageElement.src = isCheckedValue
            ? "../quantum-screen-assets/icons/checkbox-checked.svg"
            : "../quantum-screen-assets/icons/checkbox-unchecked.svg";
    }
});
