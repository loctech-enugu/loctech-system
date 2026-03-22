export interface Question {
    id: string
    type: string
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
    points: number
    difficulty: string
    categoryId: string
    category: Category
    tags: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface Category {
    id: string
    name: string
}
