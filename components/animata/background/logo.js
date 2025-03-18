import MetallicPaint, {parseLogoImage} from "@/addons/Animations/MetallicPaint/MetallicPaint";
import {useState, useEffect} from 'react';

// replace with your own SVG
// NOTE: your SVG should have a bit of padding around the shape, to keep it from being cut off
// it should also have black fill color, to allow the metallic effect to show through the mask
import logo from '@/public/logo.png';

const Logo = () => {
    const [imageData, setImageData] = useState(null);

    useEffect(() => {
        async function loadDefaultImage() {
            try {
                const response = await fetch(logo);
                const blob = await response.blob();
                const file = new File([blob], "logo.png", {type: blob.type});
                const {imageData} = await parseLogoImage(file);
                setImageData(imageData);
            } catch (err) {
                console.error("Error loading default image:", err);
            }
        }

        loadDefaultImage();
    }, []);

    return (
        <div style={{width: '100%', height: '100vh'}}>
            <MetallicPaint
                imageData={imageData}
                params={{edge: 2, patternBlur: 0.005, patternScale: 2, refraction: 0.015, speed: 0.3, liquid: 0.07}}
            />
        </div>
    );
}