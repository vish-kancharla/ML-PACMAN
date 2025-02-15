import React from "react";
import { imgSrcArrAtom } from "../GlobalState";
import { useAtom } from "jotai";
import { Button } from "@mui/material";

function Base64ArrayToJsonFile() {
    const [base64Array] = useAtom(imgSrcArrAtom);

    const handleClick = () => {
        if (base64Array.length === 0) {
            return;
        }
        // Extract src and label attributes from each image object
        const data = base64Array.map((image) => ({
            src: image.src,
            label: image.label,
        }));

        // Create JSON object with the extracted data
        const jsonObject = { data };

        // Convert JSON object to string
        const jsonString = JSON.stringify(jsonObject, null, 2);

        // Create a Blob object containing the JSON data
        const blob = new Blob([jsonString], { type: "application/json" });

        // Create a link element
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "image_data.json";

        // Dispatch a click event on the link element
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
    };

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={handleClick}
        >
            Save Current Dataset
        </Button>
    );
}

export default Base64ArrayToJsonFile;
