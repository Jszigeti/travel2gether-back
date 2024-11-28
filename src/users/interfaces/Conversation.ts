export interface Conversation {
  id: number;
  lastMessageContent: string;
  createdAt: Date;
  interlocutor: {
    userId: number;
    firstname: string;
    lastname: string;
    pathPicture: string;
  };
}
