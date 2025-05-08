import { prisma, CaseStatus } from '../src/lib/prisma.ts';

function getRelativeDate(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function seedDatabase() {
    await prisma.case.deleteMany({});

    const cases = [
        {
            title: 'Morgan Tenancy Dispute',
            description: 'Landlord seeking possession order. Claims tenant has breached terms of lease agreement.',
            status: CaseStatus.COMPLETED,
            dueDate: getRelativeDate(-5),
        },
        {
            title: 'Green Property Dispute',
            description: 'Boundary dispute between neighboring properties. Requires site visit and review of land registry documents.',
            status: CaseStatus.PENDING,
            dueDate: getRelativeDate(45),
        },
        {
            title: 'Roberts Employment Tribunal',
            description: 'Claim of unfair dismissal. Claimant alleges they were terminated due to whistleblowing activities.',
            status: CaseStatus.IN_PROGRESS,
            dueDate: getRelativeDate(10),
        },
        {
            title: 'Davies Probate Matter',
            description: 'Contested will execution. Multiple beneficiaries disputing validity of most recent will.',
            status: CaseStatus.IN_PROGRESS,
            dueDate: getRelativeDate(-15),
        },
        {
            title: 'Cooper Asylum Appeal',
            description: 'Appeal against refusal of asylum claim. Appellant fears persecution if returned to country of origin.',
            status: CaseStatus.PENDING,
            dueDate: getRelativeDate(40),
        }
    ];

    console.log(`Start seeding of cases...`);

    for (const caseData of cases) {
        const createdCase = await prisma.case.create({
            data: caseData,
        });
        console.log(`Created case with ID: ${createdCase.id}`);
    }

    console.log(`Seeding completed. Created ${cases.length} cases.`);
};

seedDatabase()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
