import {toast} from "sonner";

const getDuration = ({duration, timeout}) => duration ?? timeout;

export function addToast(options = {}) {
    const {title, description, message, color, type} = options;
    const variant = color || type;
    const content = title || description || message || "Notification";
    const toastOptions = {
        description: title ? (description || message) : undefined,
        duration: getDuration(options),
    };

    switch (variant) {
        case "success":
            return toast.success(content, toastOptions);
        case "danger":
        case "error":
            return toast.error(content, toastOptions);
        case "warning":
            return toast.warning(content, toastOptions);
        case "info":
        case "primary":
            return toast.info(content, toastOptions);
        default:
            return toast(content, toastOptions);
    }
}
