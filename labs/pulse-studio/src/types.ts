export type Status='In progress'|'In review'|'Completed';
export type Project={id:string;name:string;client:string;category:string;status:Status;budget:number;progress:number;due:string;createdAt:string};
export type Draft=Omit<Project,'id'|'createdAt'>;
