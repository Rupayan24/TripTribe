(() => {
  "use strict";

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    const setThemeToggle = (theme) => {
      themeToggle.setAttribute("aria-label", "Toggle dark theme");
      themeToggle.setAttribute("title", "Toggle dark theme");
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
      themeToggle.querySelector(".theme-toggle-icon").className =
        `fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} theme-toggle-icon`;
    };

    setThemeToggle(document.documentElement.dataset.bsTheme);
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.bsTheme === "dark" ? "light" : "dark";
      document.documentElement.dataset.bsTheme = nextTheme;
      localStorage.setItem("triptribe-theme", nextTheme);
      setThemeToggle(nextTheme);
    });
  }

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });
})();
