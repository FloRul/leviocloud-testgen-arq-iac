document.addEventListener("DOMContentLoaded", function () {
  const savedLanguage = localStorage.getItem("selectedLanguage");
  setLanguage(savedLanguage ? savedLanguage : "fr");

  const form = document.getElementById("contactForm");
  const submitButton = document.getElementById("formSubmitButton");

  function validateEmail(inputElement) {
    const email = inputElement.value;
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(email)) {
      showErrorMessage(
        inputElement,
        inputElement.getAttribute("data-val-email")
      );
      return false;
    }
    return true;
  }

  function validatePhone(inputElement) {
    const phone = inputElement.value;
    const re = /^\+?[0-9\-\s]+$/;
    if (!re.test(phone)) {
      showErrorMessage(
        inputElement,
        inputElement.getAttribute("data-val-phone")
      );
      return false;
    }
    return true;
  }

  function validateRequiredField(inputElement) {
    if (inputElement.value.trim() === "") {
      showErrorMessage(
        inputElement,
        inputElement.getAttribute("data-val-required")
      );
      return false;
    }
    return true;
  }

  function showErrorMessage(inputElement, message) {
    const span = inputElement.nextElementSibling;
    span.innerText = message;
    span.classList.add("error");
  }

  function validateForm() {
    let isValid = true;
    const inputs = form.querySelectorAll('[data-val="true"]');

    inputs.forEach((input) => {
      clearErrorMessage(input);
      const isPersonalInfoConsented =
        document.getElementById("Consent").checked;
      if (isPersonalInfoConsented) {
        if (!validateRequiredField(input)) {
          isValid = false;
        } else if (input.type === "email" && !validateEmail(input)) {
          isValid = false;
        } else if (input.type === "tel" && !validatePhone(input)) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  function submitForm() {
    let data = {
      personalInfo: {
        firstName: document.getElementById("FirstName").value,
        lastName: document.getElementById("LastName").value,
      },
      professionalInfo: {
        companyName: document.getElementById("CompanyName").value,
        contact: {
          email: document.getElementById("Email").value,
          phone: document.getElementById("Telephone").value,
        },
      },
      isPersonalInfoConsented: document.getElementById("Consent").checked,
    };
    const apiURL =
      "https://4q0xg0vhxh.execute-api.us-west-2.amazonaws.com/PROD/person";

    fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Success");
          window.location.href = "./demo.html";
        } else {
          console.error("Fail: ", response.status);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  if (submitButton) {
    submitButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (validateForm()) {
        submitForm();
      } else {
        console.log("Invalid form!!!");
      }
    });
  }
});

function setLanguage(lang) {
  clearErrorMessages();
  document.querySelectorAll("[data-key]").forEach((elem) => {
    const key = elem.getAttribute("data-key");
    const langData = languages[lang][key];

    if (elem.tagName === "A") {
      if (langData["url"]) {
        elem.href = langData["url"];
      }
      if (langData["title"]) {
        elem.title = langData["title"];
      }
      if (langData["text"]) {
        elem.innerHTML = langData["text"];
      }
    } else if (elem.tagName === "TEXTAREA") {
      if (langData["text"]) {
        elem.placeholder = langData["text"];
      }
      if (langData["data-val-required"]) {
        elem.setAttribute("data-val-required", langData["data-val-required"]);
      }
      if (langData["data-val-phone"]) {
        elem.setAttribute("data-val-phone", langData["data-val-phone"]);
      }
      if (langData["data-val-email"]) {
        elem.setAttribute("data-val-email", langData["data-val-email"]);
      }
    } else {
      elem.innerHTML = langData;
    }
  });

  const baseClass =
    "group h-extend-cursor-area text-white uppercase relative rounded-md h-8 w-9 flex justify-center items-center h-focus-state h-focus-state--offset-primary";
  const clickedClass =
    baseClass + " text-primary-500 bg-white font-extrabold cursor-default";
  const notClickedClass = baseClass + " pf-transition-link-underline-enter";

  const langFr = document.getElementById("langFr");
  const langEn = document.getElementById("langEn");

  if (lang === "fr") {
    langFr.className = clickedClass;
    langEn.className = notClickedClass;
  } else if (lang === "en") {
    langEn.className = clickedClass;
    langFr.className = notClickedClass;
  }

  localStorage.setItem("selectedLanguage", lang);
}

function clearErrorMessage(inputElement) {
  const span = inputElement.nextElementSibling;
  span.innerText = "";
  span.classList.remove("error");
}

function clearErrorMessages() {
  const form = document.getElementById("contactForm");
  if (form) {
    const inputs = form.querySelectorAll('[data-val="true"]');

    inputs.forEach((input) => {
      clearErrorMessage(input);
    });
  }
}
