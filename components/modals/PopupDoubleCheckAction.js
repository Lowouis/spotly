import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";


export default function PopupDoubleCheckAction({onConfirm, title, message, isOpen, onOpenChange}) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    }
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <p className="text-neutral-900 dark:text-neutral-100">{message}</p>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Non</Button>
                    <Button type="button" onClick={handleConfirm}>Oui</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
