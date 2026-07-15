export type Skill = {
    id: string,
    name: string,
    description: string,
    category: string,
    createdAt: string,
    updatedAt: string
}

export let SKILLS: Skill[] = [
    {
        id: '1',
        name: 'JavaScript',
        description: 'A high-level, interpreted programming language.',
        category: 'Programming Language',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
    },
    {
        id: '2',
        name: 'TypeScript',
        description: 'A strongly typed programming language that builds on JavaScript.',
        category: 'Programming Language',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
    },
    {
        id: '3',
        name: 'Python',
        description: 'A high-level, interpreted programming language.',
        category: 'Programming Language',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
    }
]

export async function getSkills() {
    await new Promise(resolve => setTimeout(() => resolve(null), 3000)); // Simulate async operation
    return [...SKILLS];
}

export async function addSkill(skill: Skill) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate async operation
    SKILLS = [...SKILLS, skill];
    console.log('Skill added:', skill);
    return getSkills();
}

