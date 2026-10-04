export interface EditableProfile {
  id: string; name: string; username: string; bio: string | null; phone: string | null;
  website: string | null; avatar: string | null; banner: string | null;
  countryId: string | null; dateOfBirth: string | null;
  countryNextChangeAt: string | null; dateOfBirthNextChangeAt: string | null;
}
export interface ProfileEditData {
  profile: EditableProfile;
  countries: { id: string; name: string; iso2: string }[];
}
export type ProfileChanges = Partial<Pick<EditableProfile, 'name' | 'username' | 'bio' | 'phone' | 'website' | 'avatar' | 'banner' | 'countryId' | 'dateOfBirth'>>;
