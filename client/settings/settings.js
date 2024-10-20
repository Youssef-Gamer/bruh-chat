const updateButton = document.querySelector("#update-button");
const removeAvatarButton = document.querySelector("#remove-avatar-button");
const fileInput = document.querySelector("#avatar-input");

const token = localStorage.getItem("token");

fileInput.onchange = () => {
    if (fileInput.files[0].size > 500_000) {
        alert("File is too big!");
        fileInput.value = "";
    }
};

updateButton.addEventListener("click", async () => {
    // Get the selected file
    const file = fileInput.files[0];

    // Check if a file is selected
    if (!file) {
        alert("Please select a file.");
        return;
    }

    // Create a new FormData object
    const formData = new FormData();
    formData.append("image", file);

    // Send a request to the server with the uploaded image
    try {
        const response = await fetch("http://192.168.1.94:3000/api/avatar/update", {
            method: "POST",
            mode: "cors",
            enctype: "multipart/form-data",
            headers: { Authorization: token },
            body: formData
        });

        // Check if the response is OK
        if (response.ok) {
            console.log("Avatar updated successfully!");
        } else {
            console.error("Failed to update avatar.");
        }
    } catch (error) {
        console.error("Error updating avatar:", error);
    }
});

removeAvatarButton.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to remove your avatar?")) return;
    
    const response = await fetch("http://192.168.1.94:3000/api/avatar", {
        method: "DELETE",
        mode: "cors",
        headers: { Authorization: token }
    });
});
