using HumanProof.Api.Application.Services;

var proofId = args.ElementAtOrDefault(0) ?? "TW-TEST-1234";
var sizeArg = args.ElementAtOrDefault(1);
var size = int.TryParse(sizeArg, out var s) ? s : 1024;

// repoRoot/tools/ProofCardGen -> repoRoot
var repoRoot = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, "..", ".."));
var apiRoot = Path.Combine(repoRoot, "api");
var templatePath = Path.Combine(apiRoot, "CardTemplates", "proof-card.svg");
var outputDir = Path.Combine(apiRoot, "wwwroot", "assets", "proof");
var publicBase = "/assets/proof";

var generator = new ProofCardSvgGenerator(templatePath, outputDir, publicBase, null);
var proofUrl = $"https://www.truwit.ai/t/{proofId}";

Console.WriteLine($"Generating proof card for {proofId} at {size}px...");
var (diskPath, publicUrl) = generator.Generate(proofId, proofUrl, size);
Console.WriteLine($"Saved: {diskPath}");
Console.WriteLine($"URL:   {publicUrl}");

