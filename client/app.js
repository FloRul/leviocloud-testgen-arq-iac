import { authenticateUser, listFiles } from "./js/auth.js";

document
  .getElementById("login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      await authenticateUser(username, password);
      document.getElementById("login").style.display = "none";
      document.getElementById("content").style.display = "block";

      const files = await listFiles();
      const fileList = document.getElementById("file-list");
      files.Contents.forEach((file) => {
        const listItem = document.createElement("li");
        listItem.textContent = file.Key;
        fileList.appendChild(listItem);
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Authentication failed. Please try again.");
    }
  });
