/**
 * Master Resume JSON Schema
 * ATS-optimized with tagged entries for cherry-picking.
 */

export function createEmptyResume() {
    return {
        version: '1.0',
        meta: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            name: 'My Master Resume',
        },
        contact: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            portfolio: '',
            github: '',
        },
        summary: {
            text: '',
            variants: [],
        },
        experience: [],
        education: [],
        skills: {
            technical: [],
            soft: [],
            languages: [],
        },
        certifications: [],
        projects: [],
        awards: [],
        publications: [],
    };
}

export function createExperienceEntry() {
    return {
        id: crypto.randomUUID(),
        company: '',
        title: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [],
        skills: [],
    };
}

export function createBulletPoint() {
    return {
        id: crypto.randomUUID(),
        text: '',
        tags: [],
        metrics: [],
    };
}

export function createEducationEntry() {
    return {
        id: crypto.randomUUID(),
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        honors: '',
    };
}

export function createSkillEntry(name = '', proficiency = 'intermediate', category = 'general') {
    return {
        id: crypto.randomUUID(),
        name,
        proficiency,
        category,
        relatedSkills: [],
    };
}

export function createCertificationEntry() {
    return {
        id: crypto.randomUUID(),
        name: '',
        issuer: '',
        date: '',
        url: '',
    };
}

export function createProjectEntry() {
    return {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        url: '',
        technologies: [],
        bullets: [],
    };
}

export function createAwardEntry() {
    return {
        id: crypto.randomUUID(),
        name: '',
        issuer: '',
        date: '',
        description: '',
    };
}

export function createPublicationEntry() {
    return {
        id: crypto.randomUUID(),
        title: '',
        venue: '',
        date: '',
        url: '',
    };
}
