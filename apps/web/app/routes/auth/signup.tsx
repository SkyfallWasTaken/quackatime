import { Loader2, X } from "lucide-react";
import { type Ref, useRef, useState } from "react";
import { Link, redirect, useNavigate } from "react-router";
import { toast } from "sonner";
import { Turnstile, type TurnstileRefFields } from "~/components/turnstile";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getAuthData } from "~/middleware/auth-data";
import { authClient } from "~/utils/auth-client";
import type { Route } from "./+types/signup";

export async function loader({ context }: Route.LoaderArgs) {
	const authData = await getAuthData(context);
	if (authData) {
		throw redirect("/");
	}
	return null;
}

export default function SignUp() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [turnstileToken, setTurnstileToken] = useState("");
	const [loading, setLoading] = useState(false);
	const turnstileRef: Ref<TurnstileRefFields | null> = useRef(null);
	const navigate = useNavigate();

	const isFormValid = () => {
		if (
			!firstName ||
			!lastName ||
			!email ||
			!password ||
			!passwordConfirmation ||
			!turnstileToken
		) {
			return false;
		}
		if (password !== passwordConfirmation) {
			return false;
		}
		if (password.length < 8) {
			return false;
		}
		return true;
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<Card className="z-50 rounded-xl max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
				<CardDescription className="text-xs md:text-sm">
					Enter your information to create an account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="grid gap-4"
					onSubmit={async (event) => {
						event.preventDefault();
						if (!isFormValid()) return;
						await authClient.signUp.email({
							email,
							password,
							name: `${firstName} ${lastName}`,
							image: image ? await convertImageToBase64(image) : "",
							callbackURL: "/auth/verify",
							fetchOptions: {
								headers: {
									"x-captcha-response": turnstileToken,
								},
								onResponse: () => {
									setLoading(false);
								},
								onRequest: () => {
									setLoading(true);
								},
								onError: (ctx) => {
									toast.error(
										ctx.error.message ||
											"An unknown error occurred. Please try again!",
									);
									turnstileRef.current?.reset();
									setTurnstileToken("");
								},
								onSuccess: async () => {
									navigate("/setup");
								},
							},
						});
					}}
				>
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="first-name">First name</Label>
							<Input
								id="first-name"
								placeholder="Max"
								required
								onChange={(e) => {
									setFirstName(e.target.value);
								}}
								value={firstName}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="last-name">Last name</Label>
							<Input
								id="last-name"
								placeholder="Robinson"
								required
								onChange={(e) => {
									setLastName(e.target.value);
								}}
								value={lastName}
							/>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							onChange={(e) => {
								setEmail(e.target.value);
							}}
							value={email}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							className="sentry-mask"
							value={password}
							required
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							placeholder="Password"
						/>
						<Input
							id="password_confirmation"
							type="password"
							className="sentry-mask"
							value={passwordConfirmation}
							required
							onChange={(e) => setPasswordConfirmation(e.target.value)}
							autoComplete="new-password"
							placeholder="Confirm Password"
							aria-label="Confirm Password"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="image">Profile Image (optional)</Label>
						<div className="flex items-end gap-4">
							{imagePreview && (
								<div className="relative w-16 h-16 rounded-sm overflow-hidden">
									<img src={imagePreview} alt="Profile preview" />
								</div>
							)}
							<div className="flex items-center gap-2 w-full">
								<Input
									id="image"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="w-full"
								/>
								{imagePreview && (
									<X
										className="cursor-pointer"
										onClick={() => {
											setImage(null);
											setImagePreview(null);
										}}
									/>
								)}
							</div>
						</div>
					</div>
					<Turnstile
						ref={turnstileRef}
						onSuccess={(token) => {
							setTurnstileToken(token);
						}}
					/>
					<Button
						type="submit"
						className="w-full"
						disabled={loading || !isFormValid()}
					>
						{loading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Create an account"
						)}
					</Button>
				</form>
			</CardContent>
			<CardFooter>
				<div className="flex justify-center w-full border-t py-4">
					<Link
						to="/auth/signin"
						className="text-center text-sm underline text-foreground/80"
					>
						Already have an account?
					</Link>
				</div>
			</CardFooter>
		</Card>
	);
}

async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
