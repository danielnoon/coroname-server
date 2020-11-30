import { HttpError } from "../http-error";
import { Permission } from "../Permission";
import { IUser } from "../models/user";

export default (
  user: IUser,
  permissions: Permission[] | Permission,
  owner?: IUser
) => {
  const p = Array.isArray(permissions)
    ? permissions
    : ([permissions] as Permission[]);

  if (user.admin || user.permissions.includes(Permission.ADMIN)) {
    return true;
  }

  if (owner && user.id === owner.id) {
    return true;
  }

  for (let permission of p) {
    if (!user.permissions.includes(permission)) {
      throw new HttpError(401, "Insufficient permissions.");
    }
  }

  return true;
};
