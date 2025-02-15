import React from "react";
import {
    imgSrcArrAtom,
    batchArrayAtom,
    batchSizeAtom,
} from "../GlobalState";
import { useAtom } from "jotai";
import { Button } from "@mui/material";

function LoadJSONButton() {

    const [imgSrcArr, setImgSrcArr] = useAtom(imgSrcArrAtom);
    const [, setBatchSize] = useAtom(batchSizeAtom);

    const handleClick = async () => {
        const res = await fetch('../asset/image_data.json')
        const image_data = await res.json()

        if (image_data.data.length > 0) {
            let newImgSrcArr = [...imgSrcArr];
            

            for (const image of image_data.data) {
                newImgSrcArr.push({ src: image.src, label: image.label });
            }

            setImgSrcArr(newImgSrcArr);
            setBatchSize(Math.floor(newImgSrcArr.length * 0.4));
        }
    };

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={handleClick}
            sx={{ mt: 1 }}
        >
            Load Saved Dataset
        </Button>
    );
}

export default LoadJSONButton;
