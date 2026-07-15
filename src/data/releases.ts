export interface Release {
  id: number;
  title: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  plannedDate: string;
}

export const releases: Release[] = [
  {
    id: 1,
    title: "Service Pack 1",
    status: "Completed",
    plannedDate: "2023-01-15"
  },
  {
    id: 2,
    title: "Service Pack 2",
    status: "In Progress",
    plannedDate: "2023-03-20"
  },
  {
    id: 3,
    title: "Service Pack 3",
    status: "Pending",
    plannedDate: "2023-06-10"
  },
  {
    id: 4,
    title: "Service Pack 4",
    status: "Completed",
    plannedDate: "2023-09-05"
  },
  {
    id: 5,
    title: "Service Pack 5",
    status: "In Progress",
    plannedDate: "2023-12-01"
  }
];