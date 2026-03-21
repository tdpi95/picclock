import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormField from "@/components/FormField";
import type { ImmichSettings } from "@/context/SettingsContext";

interface ImmichSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ImmichSettings | undefined;
    onSave: (settings: ImmichSettings) => void;
}

export const ImmichSettingsDialog: React.FC<ImmichSettingsDialogProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
}) => {
    const [instanceUrl, setInstanceUrl] = React.useState(settings?.instanceUrl || "");
    const [apiKey, setApiKey] = React.useState(settings?.apiKey || "");

    React.useEffect(() => {
        if (isOpen) {
            setInstanceUrl(settings?.instanceUrl || "");
            setApiKey(settings?.apiKey || "");
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        onSave({
            ...(settings || {
                selectedPhotos: [],
                selectedAlbums: [],
                selectionMode: "photos",
            }),
            instanceUrl,
            apiKey,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Immich Server Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <FormField label="Instance URL" orientation="vertical">
                        <Input
                            placeholder="https://immich.example.com"
                            value={instanceUrl}
                            onChange={(e) => setInstanceUrl(e.target.value)}
                        />
                    </FormField>
                    <FormField label="API Key" orientation="vertical">
                        <Input
                            type="password"
                            placeholder="Immich API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    </FormField>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
