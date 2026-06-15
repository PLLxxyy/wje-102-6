import { Recipe } from './recipe';
import { User } from './user';

export interface Collection {
  id: number;
  user_id: number;
  user?: User;
  name: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  shared_at: string | null;
  recipes: Recipe[];
  created_at: string;
  updated_at: string;
}
