/**
 * Resume state store using localStorage for persistence.
 * API keys use sessionStorage only.
 */
import { createEmptyResume } from '../models/resume-schema.js';

const STORAGE_KEY = 'resumecrafter_master_resume';
const API_SESSION_KEY = 'resumecrafter_api_config';

class ResumeStore {
    constructor() {
        this.resume = this._load();
        this.listeners = new Set();
    }

    _load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : createEmptyResume();
        } catch {
            return createEmptyResume();
        }
    }

    _save() {
        this.resume.meta.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.resume));
        this._notify();
    }

    _notify() {
        this.listeners.forEach(fn => fn(this.resume));
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    getResume() {
        return this.resume;
    }

    getSection(section) {
        return this.resume[section];
    }

    updateSection(section, data) {
        this.resume[section] = data;
        this._save();
    }

    updateContact(data) {
        this.resume.contact = { ...this.resume.contact, ...data };
        this._save();
    }

    updateSummary(data) {
        this.resume.summary = { ...this.resume.summary, ...data };
        this._save();
    }

    // Experience
    addExperience(entry) {
        this.resume.experience.push(entry);
        this._save();
    }

    updateExperience(id, data) {
        const idx = this.resume.experience.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.resume.experience[idx] = { ...this.resume.experience[idx], ...data };
            this._save();
        }
    }

    removeExperience(id) {
        this.resume.experience = this.resume.experience.filter(e => e.id !== id);
        this._save();
    }

    // Education
    addEducation(entry) {
        this.resume.education.push(entry);
        this._save();
    }

    updateEducation(id, data) {
        const idx = this.resume.education.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.resume.education[idx] = { ...this.resume.education[idx], ...data };
            this._save();
        }
    }

    removeEducation(id) {
        this.resume.education = this.resume.education.filter(e => e.id !== id);
        this._save();
    }

    // Skills
    addSkill(type, skill) {
        this.resume.skills[type].push(skill);
        this._save();
    }

    removeSkill(type, id) {
        this.resume.skills[type] = this.resume.skills[type].filter(s => s.id !== id);
        this._save();
    }

    updateSkills(type, skills) {
        this.resume.skills[type] = skills;
        this._save();
    }

    // Certifications
    addCertification(entry) {
        this.resume.certifications.push(entry);
        this._save();
    }

    updateCertification(id, data) {
        const idx = this.resume.certifications.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.resume.certifications[idx] = { ...this.resume.certifications[idx], ...data };
            this._save();
        }
    }

    removeCertification(id) {
        this.resume.certifications = this.resume.certifications.filter(e => e.id !== id);
        this._save();
    }

    // Projects
    addProject(entry) {
        this.resume.projects.push(entry);
        this._save();
    }

    updateProject(id, data) {
        const idx = this.resume.projects.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.resume.projects[idx] = { ...this.resume.projects[idx], ...data };
            this._save();
        }
    }

    removeProject(id) {
        this.resume.projects = this.resume.projects.filter(e => e.id !== id);
        this._save();
    }

    // Awards
    addAward(entry) {
        this.resume.awards.push(entry);
        this._save();
    }

    removeAward(id) {
        this.resume.awards = this.resume.awards.filter(e => e.id !== id);
        this._save();
    }

    // Import full resume
    importResume(data) {
        this.resume = { ...createEmptyResume(), ...data };
        this._save();
    }

    // Export
    exportJSON() {
        return JSON.stringify(this.resume, null, 2);
    }

    // Reset
    reset() {
        this.resume = createEmptyResume();
        this._save();
    }

    // API config (session only)
    static getApiConfig() {
        try {
            const data = sessionStorage.getItem(API_SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    static setApiConfig(config) {
        sessionStorage.setItem(API_SESSION_KEY, JSON.stringify(config));
    }

    static clearApiConfig() {
        sessionStorage.removeItem(API_SESSION_KEY);
    }
}

export const store = new ResumeStore();
