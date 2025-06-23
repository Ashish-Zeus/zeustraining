const districtRadio = document.querySelector(".district_school .radio_button");
    const independentRadio = document.querySelector(".independent_school .radio_button");

    districtRadio.parentElement.addEventListener("click", () => {
        districtRadio.src = "../quantum-screen-assets/icons/radio-button-on.svg";
        independentRadio.src = "../quantum-screen-assets/icons/radio-button-off.svg";
    });

    independentRadio.parentElement.addEventListener("click", () => {
        districtRadio.src = "../quantum-screen-assets/icons/radio-button-off.svg";
        independentRadio.src = "../quantum-screen-assets/icons/radio-button-on.svg";
    });

    
    const passwordInput = document.getElementById("password");
    const previewImage = document.querySelector(".preview_image");

    previewImage.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
            previewImage.src = "../quantum-screen-assets/icons/preview.svg";
        }
    });

    
    const rememberContainer = document.querySelector(".remember");
    const checkboxImage = rememberContainer.querySelector("img");

    let isChecked = true;

    checkboxImage.addEventListener("click", () => {
        isChecked = !isChecked;
        checkboxImage.src = isChecked
            ? "../quantum-screen-assets/icons/checkbox-checked.svg"
            : "../quantum-screen-assets/icons/checkbox-unchecked.svg";
    });