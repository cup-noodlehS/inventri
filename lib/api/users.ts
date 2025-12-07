import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

/**
 * Creates a user record in the users table after auth signup.
 * Called automatically during signup flow.
 */
export async function createUserRecord(
  userId: string,
  username: string,
  fullName: string,
  roleId: number = 3 // Default: Staff role
): Promise<{
  data: User | null;
  error: any;
}> {
  try {
    if (!userId || !username || !fullName) {
      return {
        data: null,
        error: new Error('Missing required fields: userId, username, or fullName'),
      };
    }

    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedFullName = fullName.trim();

    // Prevent duplicate usernames
    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('id')
      .eq('username', sanitizedUsername)
      .single();

    if (existingUser) {
      return {
        data: null,
        error: new Error('Username already exists'),
      };
    }
    const { data, error } = await supabase
      .from('user')
      .insert({
        id: userId,
        username: sanitizedUsername,
        full_name: sanitizedFullName,
        role_id: roleId,
        is_active: true,
        last_login: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user record:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    return { data: null, error };
  }
}

/**
 * Updates the user's last login timestamp.
 */
export async function updateLastLogin(userId: string): Promise<{
  data: boolean;
  error: any;
}> {
  try {
    if (!userId) {
      return { data: false, error: new Error('User ID is required') };
    }

    const { error } = await supabase
      .from('user')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last login:', error);
      return { data: false, error };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error in updateLastLogin:', error);
    return { data: false, error };
  }
}

/**
 * Fetches a user by their ID.
 */
export async function getUserById(userId: string): Promise<{
  data: User | null;
  error: any;
}> {
  try {
    if (!userId) {
      return { data: null, error: new Error('User ID is required') };
    }

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return { data: null, error };
  }
}

/**
 * Checks if a user record exists in the database.
 * Useful for handling legacy users created before this fix.
 */
export async function userRecordExists(userId: string): Promise<{
  data: boolean;
  error: any;
}> {
  try {
    if (!userId) {
      return { data: false, error: new Error('User ID is required') };
    }

    const { data, error } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .single();

    // PGRST116 = "not found" - that's fine, means user doesn't exist yet
    if (error && error.code !== 'PGRST116') {
      return { data: false, error };
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error in userRecordExists:', error);
    return { data: false, error };
  }
}

