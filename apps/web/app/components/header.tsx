import { Menu } from "lucide-react";
import { Link, useLocation, useRevalidator } from "react-router";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { cn } from "~/utils/misc";
import { authClient } from "~/utils/auth-client"

const paths = [
	{ name: "Home", href: "/" },
	{ name: "Projects", href: "/projects" },
	{ name: "Settings", href: "/settings" },
];

export default function SiteHeader({ signedIn }: { signedIn: boolean }) {
	const location = useLocation();
	const revalidator = useRevalidator();

	const handleSignOut = async () => {
		await authClient.signOut();
		revalidator.revalidate();
	};

	return (
		<header className="border-grid sticky top-0 z-50 w-full border-b py-3 px-4 md:py-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					<Link to="/" className="mr-4 flex items-center gap-2 lg:mr-6">
						<span className="font-bold text-sm md:text-base lg:inline-block">
							OtterTime
						</span>
					</Link>
					<nav className="hidden md:flex items-center gap-4 text-sm xl:gap-6">
						{paths.map(({ name, href }) => (
							<Link
								key={href}
								to={href}
								className={cn(
									"transition-colors hover:text-accent-foreground",
									location.pathname === href
										? "text-accent-foreground font-semibold"
										: "text-muted-foreground",
								)}
							>
								{name}
							</Link>
						))}
					</nav>
				</div>

				<div className="flex items-center gap-2">
					{/* Mobile Menu */}
					<div className="md:hidden">
						<Drawer>
							<DrawerTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Menu className="h-4 w-4" />
									<span className="sr-only">Toggle menu</span>
								</Button>
							</DrawerTrigger>
							<DrawerContent>
								<div className="flex flex-col space-y-4 p-4">
									{paths.map(({ name, href }) => (
										<Link
											key={href}
											to={href}
											className={cn(
												"text-sm font-medium transition-colors hover:text-accent-foreground",
												location.pathname === href
													? "text-accent-foreground font-semibold"
													: "text-muted-foreground",
											)}
										>
											{name}
										</Link>
									))}
									{signedIn && (
										<>
											<hr />
											<Link to="#" className="text-sm cursor-pointer font-medium transition-colors hover:text-accent-foreground" onClick={handleSignOut}>Sign out</Link>
										</>
									)}
								</div>
							</DrawerContent>
						</Drawer>
					</div>

					{/* Desktop Sign Out Button */}
					{signedIn && (
						<Button
							variant="ghost"
							onClick={handleSignOut}
							className="hidden md:inline-flex text-sm cursor-pointer"
						>
							Sign Out
						</Button>
					)}

					{/* Theme Toggle */}
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
