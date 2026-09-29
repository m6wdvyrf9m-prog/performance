export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

export type UserDirectoryProvider = {
  searchUsers(query?: string): Promise<DirectoryUser[]>;
  listFacilitators(): Promise<DirectoryUser[]>;
  listParticipants(): Promise<DirectoryUser[]>;
};
