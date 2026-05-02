import {EMAIL_TEMPLATE_NAMES} from '@/config/emailTemplates';

export function normalizeEmailTemplateSettings(settings = []) {
    const byName = new Map(settings.map(setting => [setting.templateName, setting.enabled]));

    return EMAIL_TEMPLATE_NAMES.reduce((acc, templateName) => {
        acc[templateName] = byName.has(templateName) ? byName.get(templateName) : true;
        return acc;
    }, {});
}

export async function getEmailTemplateSettings(db) {
    const settings = await db.emailTemplateSetting.findMany();
    return normalizeEmailTemplateSettings(settings);
}

export async function isEmailTemplateEnabled(db, templateName) {
    const setting = await db.emailTemplateSetting.findUnique({
        where: {templateName},
    });

    return setting?.enabled ?? true;
}
