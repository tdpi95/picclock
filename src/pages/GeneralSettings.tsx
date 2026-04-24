import React from "react";
import { useSettings } from "../context/SettingsContext";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { FieldGroup } from "@/components/ui/field";
import FormField from "@/components/FormField";
import { useTranslation } from "@/lib/translations";
import { FaGithub } from "react-icons/fa";

const GeneralSettings: React.FC = () => {
    const { generalSettings, updateGeneralSettings } = useSettings();
    const { t } = useTranslation();

    const updateLanguage = (value: "en" | "vi") => {
        updateGeneralSettings({ language: value });
    };

    return (
        <div className="p-4">
            <FieldGroup>
                <FormField label={t("language")} orientation="vertical">
                    <RadioGroup
                        value={generalSettings.language}
                        onValueChange={(v) => updateLanguage(v as "en" | "vi")}
                        className="mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="en" id="en" />
                            <label htmlFor="en">{t("english")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vi" id="vi" />
                            <label htmlFor="vi">{t("vietnamese")}</label>
                        </div>
                    </RadioGroup>
                </FormField>

                <div className="mt-8 border-t border-white/20 pt-6">
                    <a
                        href="https://github.com/tdpi95/picclock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <FaGithub size={24} />
                        <span className="font-medium">{t("github")}</span>
                    </a>
                </div>
            </FieldGroup>
        </div>
    );
};

export default GeneralSettings;
