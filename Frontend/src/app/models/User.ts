/**
 * User interface models a registered user in the PeriodTracker application.
 * Contains authentication and profile data needed by the frontend.
 */

export interface User {
    userId: number;
    name: string;
    email: string;
    pw: string;
    createdAt: Date;
}