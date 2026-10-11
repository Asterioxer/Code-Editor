from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
class ProjectSmokeTests(unittest.TestCase):
    def test_entrypoint_and_runtime(self):
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('fengari-web', html)
        self.assertTrue((ROOT / 'src/app.js').is_file())
        self.assertTrue((ROOT / 'src/styles.css').is_file())
    def test_lua_examples(self):
        self.assertGreaterEqual(len(list((ROOT / 'examples').glob('*.lua'))), 4)
    def test_pages_workflow(self):
        self.assertIn('actions/deploy-pages', (ROOT / '.github/workflows/pages.yml').read_text())
if __name__ == '__main__': unittest.main()
