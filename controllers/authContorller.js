const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { attachCookiesToResponse, createTokenUser } = require("../utils");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  // checking existing email is unique
  const emailAlreadyExist = await User.findOne({ email });
  if (emailAlreadyExist) {
    throw new CustomError.BadRequestError("Email already exist");
  }

  // first user should be admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  // save and sending user
  const user = await User.create({ name, email, password, role });

  // generate token user
  const tokenUser = createTokenUser(user);

  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // checking empty fields
  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  // checking existing user in database
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError(
      "Invalid credential.This user does not exist"
    );
  }

  // checking password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError(
      "Invalid credential.Wrong password"
    );
  }
  const tokenUser = createTokenUser(user);

  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "User logged out!" });
};

module.exports = { register, login, logout };
